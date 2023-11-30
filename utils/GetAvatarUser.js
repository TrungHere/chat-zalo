export const GetAvatarUser = (_id, type365, fromWeb, createdAt, userName, avatarUser, id365) => {
    // try {
    //     let name = (userName && userName.length) ? userName[0] : "";
    //     return `http://210.245.108.202:9002/avatar/${name}_${Math.floor(Math.random() * 4) + 1}.png`
    // } catch (e) {
    //     console.log(e)
    //     return ''
    // }
    if (avatarUser != '' && avatarUser != null) {
        if (avatarUser.toUpperCase().includes('.JPG') || avatarUser.toUpperCase().includes('.PNG') || avatarUser.toUpperCase().includes('.JPEG')) {
            if (fromWeb === 'cc365' || fromWeb === 'quanlychung') {
                const stringTime = `${('0' + new Date(createdAt * 1000).getDate()).slice(-2)}/${('0' + (new Date(createdAt * 1000).getMonth() + 1)).slice(-2)}/${new Date(createdAt * 1000).getFullYear()}`
                if (type365 === 1) {
                    // return `https://cdn.timviec365.vn/upload/company/logo/${stringTime.split('/')[2]}/${stringTime.split('/')[1]}/${stringTime.split('/')[0]}/${avatarUser}`
                    return `http://210.245.108.202:9002/qlc/upload/company/logo/${stringTime.split('/')[2]}/${stringTime.split('/')[1]}/${stringTime.split('/')[0]}/${avatarUser}`
                } else {
                    // return `https://cdn.timviec365.vn/pictures/uv/${stringTime.split('/')[2]}/${stringTime.split('/')[1]}/${stringTime.split('/')[0]}/${avatarUser}`
                    return `http://210.245.108.202:9002/qlc/upload/employee/${avatarUser}`
                }
            } else if (fromWeb === 'timviec365' || fromWeb === 'tv365') {
                const stringTime = `${('0' + new Date(createdAt * 1000).getDate()).slice(-2)}/${('0' + (new Date(createdAt * 1000).getMonth() + 1)).slice(-2)}/${new Date(createdAt * 1000).getFullYear()}`
                if (type365 === 1) {
                    // return `https://cdn.timviec365.vn/pictures/${stringTime.split('/')[2]}/${stringTime.split('/')[1]}/${stringTime.split('/')[0]}/${avatarUser}`
                    return `https://cdn.timviec365.vn/pictures/${stringTime.split('/')[2]}/${stringTime.split('/')[1]}/${stringTime.split('/')[0]}/${avatarUser}`
                } else {
                    // return `https://cdn.timviec365.vn/pictures/uv/${stringTime.split('/')[2]}/${stringTime.split('/')[1]}/${stringTime.split('/')[0]}/${avatarUser}`
                    return `https://cdn.timviec365.vn/pictures/uv/${stringTime.split('/')[2]}/${stringTime.split('/')[1]}/${stringTime.split('/')[0]}/${avatarUser}`
                }
            } else {
                return avatarUser
            }
        }
        else {
            try {
                let name = (userName && userName.length) ? userName[0] : "";
                return `http://210.245.108.202:9002/avatar/${name}_${Math.floor(Math.random() * 4) + 1}.png`
            } catch (e) {
                console.log(e)
                return ''
            }
        }
    } else {
        try {
            let name = (userName && userName.length) ? userName[0] : "";
            return `http://210.245.108.202:9002/avatar/${name}_${Math.floor(Math.random() * 4) + 1}.png`
        } catch (e) {
            console.log(e)
            return ''
        }
    }
}

export const GetAvatarUserSmall = (_id, userName, avatarUser) => {
    // try {
    //     return `http://210.245.108.202:9002/avatar/${userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
    // } catch (e) {
    //     return 'http://210.245.108.202:9002/avatar/T.png'
    // }
    if (avatarUser != '' && avatarUser != null) {
        if (avatarUser.toUpperCase().includes('.JPG') || avatarUser.toUpperCase().includes('.PNG') || avatarUser.toUpperCase().includes('.JPEG')) {
            return `http://210.245.108.202:9002/avatarUserSmall/${_id}/${avatarUser}`
        }
        else {
            try {
                return `http://210.245.108.202:9002/avatar/${userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
            } catch (e) {
                return ''
            }
        }
    } else {
        try {
            return `http://210.245.108.202:9002/avatar/${userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
        } catch (e) {
            return ''
        }
    }
}