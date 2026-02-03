import { mockUsers, deplay } from "../lib/dbMock";

export async function validateUser(username: string , password: string) {
    await deplay(1000); 

    const user = mockUsers.find(user => user.username === username && user.passoword === password)

    if(!user){
        throw new Error('Usuário ou senha inválidos');
    }

    return {id: user.id, username: user.username};
}