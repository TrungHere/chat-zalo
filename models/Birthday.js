import mongoose from "mongoose";
const BirthdaySchema = new mongoose.Schema(
  {
      UserId: {
        type: Number,
        required: true,
      },
      userName:{
        type: String
      },
      avatarUser:{
        type: String,
      },
      Dob: {
        type: String,
        required: true,
      },
      createAt: {
        type: Date,
        required: true,
    },
    birthdayList:{
      type: Array,
    }

  },
  { collection: 'Birthday',
  versionKey: false }
);

export default mongoose.model("Birthday", BirthdaySchema);