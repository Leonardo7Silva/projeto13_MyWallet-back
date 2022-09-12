import joi from "joi";
import bcrypt from "bcrypt";
import db from "./conectController.js";
import { v4 as uuid } from 'uuid';



const cadastroSchema = joi.object({
    nome: joi.string().empty().required(),
    email: joi.string().empty().required(),
    senha: joi.string().min(8).empty().required()
}); 

const loginSchema = joi.object({
    email: joi.string().empty().required(),
    senha: joi.string().min(8).empty().required()  
});

async function cadastrarUsuario(req,res){
    const {nome, email, senha} = req.body;
    const validacao = cadastroSchema.validate(req.body, {abortEarly: false});
    if(validacao.error){
        const erros = validacao.error.details.map(value => value.message);
        return res.status(422).send(erros);
    };

    const hashSenha = bcrypt.hashSync(senha, 10);

    try{
        const emailExistente = await db.collection("cadastros").find({"email":email}).toArray();
        if(emailExistente.length > 0){
            res.status(409).send("Já existe uma conta com esse E-mail")
        }
        await db.collection("cadastros").insertOne({
            "nome": nome,
            "email": email,
            "senha": hashSenha
        })

        res.sendStatus(201);

    }catch(err){
        res.status(500).send(err.message)
    }
}

async function logarUsuario(req, res){
    const {email, senha} = req.body;
    const validacao = loginSchema.validate(req.body, {abortEarly: false})
    if(validacao.error){
        const erros = validacao.error.details.map(value => value.message);
        return res.status(422).send(erros);
    };

    try{
        const usuario = await db.collection("cadastros").find({"email":email}).toArray();
        const senhaEhValida = bcrypt.compareSync(senha, usuario[0].senha);
        if(usuario.length===0 || !senhaEhValida){
            return res.status(401).send("usuário ou senha inválida");
        }
        const token = uuid();
        await db.collection("sessoes").insertOne({
            userId: usuario[0]._id,
            token
        })

        res.send({token, "nome":usuario[0].nome});

    }catch(err){
        res.status(500).send(err.message);
    }
}

export {cadastrarUsuario, logarUsuario};