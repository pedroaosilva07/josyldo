'user client';

import { validateUser } from "../sevices/authService";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData){
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try{
        const user = await validateUser(username, password);
        return {success: true, message: `Bem-vindo, ${user.username}!`};
    } catch (error: any) {
        return {success: false, message: error.message};
    }
}