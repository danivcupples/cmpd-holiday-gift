const db = require('../../models');

class VuetableApi {
  constructor(req, itemsPerPage = 10) {
    this.req = req;
    this.itemsPerPage = itemsPerPage;
  }

  async fetch(modelName, where = {}) {
    return await db[modelName].findAndCountAll({
      limit: this.itemsPerPage,
      offset: this.getCurrentOffset(),
      where: where
    });
  }

  fetchAndParse(modelName, where = {}) {
    let resultSet = this.fetch(modelName, where);
    return this.parseResultSet();
  }

  getCurrentPage() {
    let { req } = this;
    return !req.query.page || isNaN(req.query.page) ? 1 : parseInt(req.query.page);
  }

  getCurrentOffset() {
    return (this.getCurrentPage() - 1) * this.itemsPerPage;
  }

  parseResultSet(resultSet) {
    const req = this.req;
    const currentPage = this.getCurrentPage();
    let lastPage = Math.ceil(resultSet.count / this.itemsPerPage);
    let baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;

    let nextPageNumber = VuetableApi.calculateNextPage(req, resultSet, currentPage, lastPage);
    let previousPageNumber = VuetableApi.calculatePreviousPage(req, resultSet, currentPage, lastPage);

    return {
      total: resultSet.count,
      per_page: this.itemsPerPage,
      current_page: currentPage,
      last_page: lastPage,
      next_page_url: nextPageNumber !== null ? `${baseUrl}?page=${nextPageNumber}` : null,
      prev_page_url: previousPageNumber !== null ? `${baseUrl}?page=${previousPageNumber}` : null,
      from: currentPage,
      to: currentPage - 1 + resultSet.rows.length,
      data: resultSet.rows
    };
  }
}

VuetableApi.calculateNextPage = (req, resultSet, currentPage, lastPage) => {
  if (currentPage >= lastPage) {
    return null;
  } else if (currentPage < 1) {
    return 1;
  } else {
    return currentPage + 1;
  }
};

VuetableApi.calculatePreviousPage = (req, resultSet, currentPage, lastPage) => {
  if (currentPage <= 1) {
    return null;
  } else if (currentPage > lastPage) {
    return lastPage;
  } else {
    return currentPage - 1;
  }
};

module.exports = VuetableApi;
