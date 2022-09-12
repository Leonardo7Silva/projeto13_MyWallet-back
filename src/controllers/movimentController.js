import db from "./conectController.js";
import joi from "joi";
import dayjs from "dayjs";
import { ObjectId} from "mongodb";

const movimentacaoSchema = joi.object({
    descricao: joi.string().empty().required(),
    valor: joi.number().required(),
    tipo: joi.string().empty().required()
});

async function MovimentacaoUsuario(req,res){
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
};

async function puxarMovimentacoes(req,res){
    const {autorizacao} = req.headers;
    const token = autorizacao?.replace('Bearer ', '');
    if(!token) return res.sendStatus(401);

    try{
        const sessao = await db.collection("sessoes").find({ "token": autorizacao }).toArray();
        if(sessao.length===0){
            return res.sendStatus(401);
        }
        const usuario = await db.collection("cadastros").find({_id: sessao[0].userId}).toArray();
        if(usuario.length===0){
            return res.sendStatus(401);
        }
        const movimentacoes = await db.collection("movimentacoes").find({"email":usuario[0].email}).toArray();
        
        res.send(movimentacoes);


    }catch(err){
        res.status(500).send(err.message);
    }
}
async function deletarMovimentacoes(req, res){
    const {autorizacao} = req.headers;
    const token = autorizacao?.replace('Bearer ', '');
    if(!token) return res.sendStatus(401);
    const {id} = req.params
    try{
        const sessao = await db.collection("sessoes").find({ "token": autorizacao }).toArray();
        if(sessao.length===0){
            return res.sendStatus(401);
        }
        await db.collection("movimentacoes").deleteOne({"_id": ObjectId(id)})
        res.sendStatus(200)
    }catch(err){
        res.status(500).send(err.message);
    }
}

export {MovimentacaoUsuario, puxarMovimentacoes, deletarMovimentacoes};