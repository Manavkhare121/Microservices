import jwt from "jsonwebtoken";
function createauthmiddleware(roles=["user",]){
    return function authmiddlware(req,res,next){
        const token=req.cookies?.token || req.headers?.authorization?.split(' ')[1];
        if(!token){
            return res.status(401).json({
                message:'Unauthorized:No Token provided',
            })
        }
        try{
            const decoded=jwt.verify(token,process.env.JWT_SECRET);
            if(!roles.includes(decoded.role)){
                return res.status(403).json({
                    message:'Forbidden:Insufficient Permissions'
                })
            }
            req.user = decoded;
            next();

        }
        catch(err){
            return res.status(401).json({
                message:'Unauthorized:Invalid token',
            })
        }
    }
}
export {createauthmiddleware}