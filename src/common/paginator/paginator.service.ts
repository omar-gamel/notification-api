import {
  CursorBasedPaginationArgsType,
  CursorBasedPaginationDirection,
  PaginationRes
} from './paginator.types';
import { MyModelStatic } from '../database/database.static-model';
import { Op } from 'sequelize';
import { Literal } from 'sequelize/types/utils';

// Need to be refactored

export const cursorPaginate = async <T>(
  args: CursorBasedPaginationArgsType
): Promise<PaginationRes<T>> => {
  let dateCursor = args.cursor && new Date(Number(args.cursor)),
    sequelizeOperator = args.direction === CursorBasedPaginationDirection.AFTER ? Op.lte : Op.gte,
    orderDirection = args.direction === CursorBasedPaginationDirection.AFTER ? 'DESC' : 'ASC';

  const items = await args.model.findAll({
    where: {
      ...args.filter,
      ...(dateCursor && { createdAt: { [sequelizeOperator]: new Date(dateCursor) } })
    },
    order: [['createdAt', orderDirection]],
    limit: args.limit + 1,
    include: args.include,
    nest: true,
    raw: true,
    logging: true
  });

  let hasNext = items.length === args.limit + 1,
    hasBefore = items.length === args.limit + 1,
    nextCursor = null,
    beforeCursor = null,
    nextCursorRecord = hasNext ? items[args.limit] : null,
    beforeCursorRecord = hasBefore ? items[args.limit] : null;

  if (!items.length)
    return {
      pageInfo: { nextCursor, hasNext, beforeCursor, hasBefore },
      items: <any>items
    };

  if (!dateCursor) dateCursor = new Date(items[0].createdAt);

  if (args.direction === CursorBasedPaginationDirection.BEFORE) {
    const nextItem = await args.model.findOne({
      where: {
        ...args.filter,
        ...(dateCursor && { createdAt: { [Op.lt]: new Date(dateCursor) } })
      },
      order: [['createdAt', 'DESC']],
      limit: 1,
      include: args.include,
      nest: true,
      raw: true,
      attributes: ['createdAt']
    });
    hasNext = !!nextItem;
    if (nextItem) {
      nextCursorRecord = nextItem;
      items.push(nextItem);
    }
  }

  if (args.direction === CursorBasedPaginationDirection.AFTER) {
    const beforeItem = await args.model.findOne({
      where: {
        ...args.filter,
        ...(dateCursor && { createdAt: { [Op.gt]: new Date(dateCursor) } })
      },
      order: [['createdAt', 'ASC']],
      limit: 1,
      include: args.include,
      nest: true,
      raw: true,
      attributes: ['createdAt']
    });
    hasBefore = !!beforeItem;
    if (beforeItem) {
      beforeCursorRecord = beforeItem;
      items.unshift(beforeItem);
    }
  }

  if (hasNext) {
    nextCursor = nextCursorRecord.createdAt.getTime().toString();
    items.pop();
  }
  if (hasBefore) {
    beforeCursor = beforeCursorRecord.createdAt.getTime().toString();
    items.shift();
  }

  if (args.direction === CursorBasedPaginationDirection.BEFORE) items.reverse();

  return {
    pageInfo: { nextCursor, hasNext, beforeCursor, hasBefore },
    items: <any>items
  };
};

export const paginate = async <T>(
  model: MyModelStatic,
  filter = {},
  sort: string | Literal = '-createdAt',
  page = 0,
  limit = 15,
  include: any = []
): Promise<PaginationRes<T>> => {
  let totalPages = 0,
    totalCount = 0,
    hasNext = false;
  // Using `findAll` instead of `count` because `count` generates a different SQL
  totalCount = (await model.findAll({ where: filter, include })).length;
  if (limit > 50) limit = 50;
  if (limit < 0) limit = 15;
  if (page < 0) page = 0;
  totalPages = totalCount / limit < 1 ? 1 : Math.ceil(totalCount / limit);
  let skip = page > 1 ? (page - 1) * limit : 0;
  hasNext = skip + limit < totalCount;
  if (!sort) sort = '-createdAt';
  let order = null;
  // Literal query
  if (typeof sort === 'object') order = sort;
  else order = [[sort.replace('-', ''), sort.startsWith('-') ? 'DESC' : 'ASC']];
  let items = await model.findAll({
    where: filter,
    ...(order && { order }),
    limit,
    offset: skip,
    include,
    nest: true,
    raw: true
  });
  return {
    pageInfo: {
      hasBefore: page > 1,
      page,
      hasNext
    },
    items: <any>items
  };
};

export const manualPaginator = <T>(
  array: T[] = [],
  filter = {},
  sort = '-createdAt',
  page = 0,
  limit = 15
): PaginationRes<T> => {
  let res = {
    pageInfo: {
      page: 0,
      hasNext: false,
      hasBefore: false
    },
    items: []
  };
  if (!array || !array.length) return res;
  let totalPages = 0,
    totalCount = 0,
    hasNext = false;
  let sortField = sort;
  sortField = sort && sort.startsWith('-') ? sort.replace('-', '') : null;
  let items = !sort
    ? array
    : sort.startsWith('-')
    ? array.sort((a, b) => b[sortField] - a[sortField])
    : array.sort((a, b) => a[sortField] - b[sortField]);
  if (filter && Object.keys(filter).length) {
    items = array.filter(entity => {
      for (let i in filter) {
        return entity[i] === filter[i];
      }
    });
  }
  totalCount = items.length;
  if (limit > 50) limit = 50;
  if (limit < 0) limit = 15;
  if (page < 0) page = 0;
  totalPages = totalCount / limit < 1 ? 1 : Math.ceil(totalCount / limit);
  let skip = page > 1 ? (page - 1) * limit : 0;
  hasNext = skip + limit < totalCount;
  items = items.slice(skip, limit + skip);
  return {
    pageInfo: {
      page,
      hasNext,
      hasBefore: page > 1
    },
    items
  };
};

export const manualPaginatorReturnsArray = <T>(
  array: T[] = [],
  filter = {},
  sort = '-createdAt',
  page = 0,
  limit = 15
): T[] => {
  if (!array || !array.length) return [];
  let sortField = sort;
  sortField = sort && sort.startsWith('-') ? sort.replace('-', '') : null;
  let items = !sort
    ? array
    : sort.startsWith('-')
    ? array.sort((a, b) => b[sortField] - a[sortField])
    : array.sort((a, b) => a[sortField] - b[sortField]);
  if (filter && Object.keys(filter).length) {
    items = array.filter(entity => {
      for (let i in filter) {
        return entity[i] === filter[i];
      }
    });
  }
  if (limit > 50) limit = 50;
  if (limit < 0) limit = 15;
  if (page < 0) page = 0;
  let skip = page > 1 ? (page - 1) * limit : 0;
  items = items.slice(skip, limit + skip);
  return items;
};
