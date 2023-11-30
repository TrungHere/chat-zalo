import jwt from "jsonwebtoken";

export const tokenPassword = () => {
    return "vfvjdfvbjfdbvffgbfubfugbfug"
        // return "Chamcong365@"
}

// check can convert to data Obj 
// check expired 
export const checkToken = async(token) => {
    try {
        let user
        try {
            user = await jwt.verify(token, tokenPassword());
            if (user.UnCheckExpired) {
                return {
                    userId: user._id,
                    status: true
                }
            }
            if (new Date(user.timeExpried) > new Date()) {
                return {
                    userId: user._id,
                    status: true
                }
            } else {
                return {
                    userId: "",
                    status: false
                }
            }
        } catch (err) {
            user = await jwt.verify(token, 'Chamcong365@');
            if (user) {
                return {
                    userId: user.data._id,
                    status: true
                }
            } else {
                return {
                    userId: "",
                    status: false
                }
            }
        }
    } catch (e) {
        // console.log(e);
        return {
            userId: "",
            status: false
        }
    }
};