// Hàm khi thành công
export const success = (res, messsage = "", data = []) => {
    return res.status(200).json({ data: { result: true, message: messsage, ...data }, error: null });
  };
  
  // Hàm khi thất bại
  export const setError = (res, message, code = 500) => {
    return res.status(code).json({ data: null, code, error: { message } });
  };
  
  // Hàm tìm id max
  export const getMaxID = async (model) => {
    const maxUser = await model.findOne({}, {}, { sort: { _id: -1 } }).lean() || 0;
    return maxUser._id;
  };
  