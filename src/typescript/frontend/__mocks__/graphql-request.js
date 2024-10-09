module.exports = {
    GraphQLClient: jest.fn().mockImplementation(() => ({
      request: jest.fn().mockResolvedValue({}),
    })),
    gql: jest.fn((...args) => args[0]),
  };


