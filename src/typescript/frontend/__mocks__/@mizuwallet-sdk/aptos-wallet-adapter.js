// __mocks__/@mizuwallet-sdk/aptos-wallet-adapter.js

const mockAdapter = {
    // Add any methods or properties that your tests might use
    connect: jest.fn(),
    disconnect: jest.fn(),
    signAndSubmitTransaction: jest.fn(),
    // Add more mock methods as needed
  };

  module.exports = mockAdapter;

