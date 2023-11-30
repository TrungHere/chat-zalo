import axios from 'axios'
import qs from 'qs'
export const getIdTimViec = async (email, type) => {
    let response = await axios.post('https://timviec365.vn/api_app/get_id_email.php',  qs.stringify({
        'email':String(email),
        'type': String(type)
      }));
    if(response.data.data && response.data.data.id){
      return response.data.data.id;
    }
    else{
      return 0;
    }
};