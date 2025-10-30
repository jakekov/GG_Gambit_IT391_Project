import express, {Request, Response, NextFunction} from 'express';
import {stringify as uuidStringify} from 'uuid';
import {badRequest} from '@/utils/http.js';
import {
  check_sign_in_enabled,
  get_or_create_oauth_account,
  oath_callback_profile,
  oauth_redirect_links,
} from './helpers/index.js';

const router = express.Router();
/**
 * Makes sure the server can handle sending oauth links
 * this probably needs to change because it requires the serve to have all oauth providers set up
 */
router.use('/', check_sign_in_enabled);
/**
 * Rederict links for each oauth provider
 */
router.get(
  '/redirect/:provider',
  async (req: Request<{provider?: string}>, res: Response) => {
    const provider = req.params.provider;
    if (!provider) return badRequest(res);

    let url = oauth_redirect_links(provider);
    res.redirect(url);
  }
);
/**
 * When the user is done authenticating with the Oauth provider it sends the browser to this route
 * this route takes the provider and creates a profile from the helper for each auth provider
 * it then logs in the user to the existing account or creates a new account
 */
router.get(
  '/callback/:provider/',
  async (req: Request<{provider?: string}>, res: Response) => {
    const provider = req.params.provider;
    if (!provider) return badRequest(res);
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.status(403).json({error: 'code not defined'});
    }
    var profile;
    try {
      profile = await oath_callback_profile(provider, code);
    } catch (err) {
      console.log(err);
      return res.status(403).json({error: 'unable to verify google account'});
    }
    let user = await get_or_create_oauth_account(profile);

    console.log(`logged in Oauth ${provider} ${profile.email}`);
    req.session.user = {
      id: uuidStringify(user.id),
      username: user.username,
      id_buf: user.id,
    }; //create the auth session info
    res.redirect('/dashboard');
  }
);

export default router;
