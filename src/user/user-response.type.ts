import { User } from './user.model';
import { generateGqlResponseType } from '../Common/graphql/graphql-response.type';

export const GqlUserResponse = generateGqlResponseType(User);
export const GqlUsersResponse = generateGqlResponseType(Array(User));
