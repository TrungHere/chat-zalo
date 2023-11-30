import fs from 'fs'
const myConsole = new console.Console(fs.createWriteStream('./logs/exceptionsocket.log'));
export const LogsSocketExceptionWpf = async (req, res) => {
    try {
      myConsole.log("Exception");
      myConsole.log(req.body);
      return res.json({
        data: {
            result:true
        }
      })
    } catch (err) {
      console.log(err);
      return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
  };