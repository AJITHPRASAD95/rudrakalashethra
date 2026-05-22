class ApiResponse {
  static success(data, message='Success') {
    return { success: true, message, data };
  }
  static paginated(data, total, page, limit, message='Success') {
    return { success: true, message, data, pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total/limit) } };
  }
}
module.exports = ApiResponse;
