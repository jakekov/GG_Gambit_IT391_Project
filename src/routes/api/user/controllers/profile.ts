import  UserModel from "../../../../models/user";
import { UserProfileData } from "../../../../types/user";

import {  parse as UuidParse, stringify as UuidStringify } from "uuid";
import { HTTP_STATUS } from "../../../../http";
import { PatchUserForm } from "../router";
import { DatabaseError } from "../../../../errors";
import BetInfo from "../../../../models/userBetInfo";

export async function getUserProfileData(slug: string) {
    var id = null;
    try {
         id = UuidParse(slug);
    } catch (err) {

    }
    var users;
    if (id) {
        users = await UserModel.getUserByUuid(Buffer.from(id));
    } else {
        users = await UserModel.getUserByUsername(slug);
    }
    
    
    if (users.length == 0) return { data: { success: false, message: "User not found" }, status: HTTP_STATUS.NOT_FOUND };
    let user = users[0];
    let bet_info = await BetInfo.getInfoByUuid(user.id);
    let points = bet_info.length == 0 ? null : bet_info[0].points;
    const dataObj = {
        id: UuidStringify(user.id),
        username: user.username,
        display_name: user.display_name || user.username,
        avatar: user.avatar, //userFileUrl(user.id, user.avatar),
        date_joined: new Date(user.created),
        points: points
    } satisfies UserProfileData;

    return { data: dataObj, status: HTTP_STATUS.OK };
}
export async function updateUserProfile(form: PatchUserForm, user_id: Buffer) {

    
    if (form.username)  {
      let rows = await UserModel.getUserByUsername(form.username);
    if (rows.length != 0) return { data: { success: false, message: "Username already taken" }, status: HTTP_STATUS.BAD_REQUEST };
        await UserModel.updateUsername(form.username, user_id);
        //since its only three i think this is okay but i could just get the user and replace whatever is null
        //and just update all three at once
    }
    if (form.display_name) {
        await UserModel.updateDisplayName(form.display_name,user_id);
    }
    if (form.avatar) {
        await UserModel.updateAvatar(form.avatar, user_id)
    }
    let rows = await UserModel.getUserByUuid(user_id);
    if (rows.length == 0) throw new DatabaseError(" user id doesnt exist somehow");
    let user = {
        username: rows[0].username,
        display_name: rows[0].display_name,
        avatar: rows[0].avatar,
    }
    return  { data: { success: true, message: "Profile updated Succesfully", user: user}, status: HTTP_STATUS.OK };
}