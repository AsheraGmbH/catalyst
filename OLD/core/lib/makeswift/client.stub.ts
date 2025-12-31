export const client = {
  getPages() {
    return {
      async toArray() {
        return [];
      },
    };
  },
  async getPageSnapshot() {
    return null;
  },
  async getComponentSnapshot() {
    return null;
  },
};
