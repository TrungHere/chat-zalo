
export const HandleNoSqlInjection =  (input) => {
   try{
        let output = String(input).replace("[object Object]","");
        if(output !=""){
            output= String(output).replace("$","");
        output= String(output).replace(":","");
        output= String(output).replace("{","");
        output= String(output).replace("}","");
        }
        return output;
   }
   catch(e){
    console.log(e);
    return "";
   }
};