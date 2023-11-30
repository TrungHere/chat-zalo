
export const ConvertToArrayString  = (string) =>{
    try{
       let StringArray = String(string).replace("[","").replace("]","");
       let array = StringArray.split(",");
       let arrayFinal = [];
       for(let i=0; i<array.length; i++){
           arrayFinal.push(String(array[i]))   
       }
       return arrayFinal;
    }
    catch(e){
       console.log(e)
       return [];
    }
  }

export const ConvertToArrayNumber  = (string) =>{
   try{
      let StringArray = String(string).replace("[","").replace("]","");
      let array = StringArray.split(",");
      let arrayFinal = [];
      for(let i=0; i<array.length; i++){
            if(!isNaN(array[i])){
               arrayFinal.push(Number(array[i]))
            }
      }
      return arrayFinal;
   }
   catch(e){
      return [];
      console.log(e)
   }
}