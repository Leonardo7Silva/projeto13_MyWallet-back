import express from "express";
import cors from "cors";
import {cadastrarUsuario, logarUsuario} from "./controllers/authController.js"
import {MovimentacaoUsuario, puxarMovimentacoes, deletarMovimentacoes} from "./controllers/movimentController.js"

const app = express();
app.use(express.json());
app.use(cors());

//cadastro

app.post("/cadastros", cadastrarUsuario); 

//log in

app.post("/login", logarUsuario);

//movimentacoes

app.post("/movimentacoes", MovimentacaoUsuario);
app.get("/movimentacoes", puxarMovimentacoes);
app.delete("/movimentacoes/:id", deletarMovimentacoes);


app.listen(5000, ()=>console.log("Ouvindo na porta 5000"));