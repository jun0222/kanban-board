/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getTodo = /* GraphQL */ `
  query GetTodo($id: ID!) {
    getTodo(id: $id) {
      id
      title
      detail
      createdAt
      updatedAt
    }
  }
`;
export const listTodos = /* GraphQL */ `
  query ListTodos(
    $filter: ModelTodoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        detail
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
export const getColumn = /* GraphQL */ `
  query GetColumn($id: ID!) {
    getColumn(id: $id) {
      id
      title
      createdAt
      updatedAt
    }
  }
`;
export const listColumns = /* GraphQL */ `
  query ListColumns(
    $filter: ModelColumnFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listColumns(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
export const getCard = /* GraphQL */ `
  query GetCard($id: ID!) {
    getCard(id: $id) {
      id
      title
      detail
      createdAt
      updatedAt
    }
  }
`;
export const listCards = /* GraphQL */ `
  query ListCards(
    $filter: ModelCardFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCards(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        detail
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
