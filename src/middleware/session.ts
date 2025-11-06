import {AuthenticatedUser} from '@/types/express.js';
import {notAuthenticated} from '@/utils/http.js';
import {Request, Response, NextFunction} from 'express';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  //do a translation from express- session to our own req object
  //that way i dont trigger a save and i can keep session seperate from authentication
  //then also do ip address / session comparison to double check the session hasnt been hijacked
  if (req.session.user) {
    const buf = !(req.session.user.id_buf instanceof Buffer)
      ? Buffer.from(req.session.user.id_buf)
      : req.session.user.id_buf;

    const auth_user = {
      username: req.session.user.username,
      string_id: req.session.user.id,
      uuid: buf,
    } as AuthenticatedUser;
    req.auth_user = auth_user;
    next();
  } else {
    return notAuthenticated(res);
  }
}
