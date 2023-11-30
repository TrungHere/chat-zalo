export const createError = (code, message) => {
    const err = new Error();
    err.code = code;
    err.message = message;
    return {data:null,error:err};
  };