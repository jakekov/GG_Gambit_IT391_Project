import  UserModel from "../../../../models/user";
import { UserProfileData } from "../../../../types/user";

import {  parse as UuidParse, stringify as UuidStringify } from "uuid";
import { HTTP_STATUS } from "../../../../http";

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
    const dataObj = {
        id: UuidStringify(user.id),
        username: user.username,
        display_name: user.display_name || user.username,
        avatar: user.avatar, //userFileUrl(user.id, user.avatar),
        date_joined: new Date(user.created),
    } satisfies UserProfileData;

    return { data: dataObj, status: HTTP_STATUS.OK };
}