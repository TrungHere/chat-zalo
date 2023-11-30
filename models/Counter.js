import mongoose from "mongoose";
// let CounterConversation = mongoose.createConnection('mongodb://localhost:27017/api-base365');
const CounterSchema = new mongoose.Schema(
  {
      name: {
        type: String,
        require:true,
      },
      countID: {
        type: Number,
        require:true,
      },
  },
  { collection: 'Counter', 
    versionKey: false   // loai bo version key 
  }
);

// export default CounterConversation.model("Counter", CounterSchema);
export default mongoose.model("Counter", CounterSchema);