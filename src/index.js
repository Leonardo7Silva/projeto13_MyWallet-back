import express from "express";
import cors from "cors";
import joi from "joi";
import dotenv from "dotenv";
import dayjs from "dayjs";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { v4 as uuid } from 'uuid';


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(()=>{
    db = mongoClient.db("projeto13_wallet");
})

const cadastroSchema = joi.object({
    nome: joi.string().empty().required(),
    email: joi.string().empty().required(),
    senha: joi.string().min(8).empty().required()
}); 

const loginSchema = joi.object({
    email: joi.string().empty().required(),
    senha: joi.string().min(8).empty().required()  
});

const movimentacaoSchema = joi.object({
    descricao: joi.string().empty().required(),
    valor: joi.number().required(),
    tipo: joi.string().empty().required()
})

//cadastro

app.post("/cadastros", async (req,res)=>{
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
});

//log in

app.post("/login", async (req, res)=>{
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
});

//movimentacoes

app.post("/movimentacoes", async(req,res)=>{
    const {descricao, valor, tipo} = req.body;

    const validacao = movimentacaoSchema.validate(req.body, {abortEarly: false})
    if(validacao.error){
        const erros = validacao.error.details.map(value => value.message);
        return res.status(422).send(erros);
    };

    const {autorizacao} = req.headers;
    const token = autorizacao?.replace('Bearer ', '');
    if(!token) return res.sendStatus(401);

    try{
        const sessao = await db.collection("sessoes").find({ "token": autorizacao }).toArray();
        console.log(sessao);
        if(sessao.length===0){
            return res.sendStatus(401);
        }
        const usuario = await db.collection("cadastros").find({_id: sessao[0].userId}).toArray();
        if(usuario.length===0){
            return res.sendStatus(401);
        }
        await db.collection("movimentacoes").insertOne({
            "email": usuario[0].email,
            "valor": valor,
            "tipo": tipo,
            "descricao": descricao,
            "data": `${dayjs().format('DD/MM')}`
        })
        res.sendStatus(201);
    }catch(err){
        res.status(500).send(err.message);
    }
});

app.get("/movimentacoes", async (req,res)=> {
    const {autorizacao} = req.headers;
    const token = autorizacao?.replace('Bearer ', '');
    if(!token) return res.sendStatus(401);

    try{
        const sessao = await db.collection("sessoes").find({ "token": autorizacao }).toArray();
        console.log(sessao)
        if(sessao.length===0){
            return res.sendStatus(401);
        }
        const usuario = await db.collection("cadastros").find({_id: sessao[0].userId}).toArray();
        console.log(sessao)
        if(usuario.length===0){
            return res.sendStatus(401);
        }
        const movimentacoes = await db.collection("movimentacoes").find({"email":usuario[0].email}).toArray();
        
        res.send(movimentacoes);


    }catch(err){
        res.status(500).send(err.message);
    }
})




app.listen(5000, ()=>console.log("Ouvindo na porta 5000"));