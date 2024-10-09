
const mockAdapter = {
    headers: () => {
      return new Map([["x-real-ip", "0.0.0.0"]]);
    },
  };

  module.exports = mockAdapter;

