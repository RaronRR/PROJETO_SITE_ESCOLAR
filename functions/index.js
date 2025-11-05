/* eslint-disable indent */
/* eslint-disable comma-dangle */

const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp();
const db = admin.firestore();

exports.cadastroAlunoAdmin = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "http://127.0.0.1:5500");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Metodo não permitido. Use POST");
  }

  const {
    nomeAluno,
    turma,
    dataNascimento,
    nomeResponsavel,
    emailResponsavel,
  } = req.body;

  if (!nomeAluno || !emailResponsavel) {
    return res.status(400).send("Dados incompletos.");
  }

  let responsibleUID = null;

  try {
    const responsavelQuery = await db.collection("usuarios")
        .where("email", "==", emailResponsavel)
        .limit(1)
        .get();

    if (responsavelQuery.empty) {
      return res.status(404)
      .send("Erro: Responsável com o email não foi encontrado.");
    }

    responsibleUID = responsavelQuery.docs[0].id;
  } catch (error) {
    console.error("Erro no Backend ao buscar responsável:", error);
    return res.status(500).send("Erro interno ao buscar responsável.");
  }

  const dadosAlunos = {
    nomeAluno,
    turma,
    dataNascimento,
    nomeResponsavel,
    emailResponsavel,
    responsibleUID,
    dataDeCadastro: new Date().toISOString(),
  };

  try {
    await db.collection("alunos").add(dadosAlunos);
    return res.status(200).send("Aluno cadastrado com sucesso!");
  } catch (error) {
    console.error("Erro no Backend ao cadastrar aluno:", error);
    return res.status(500).send("Erro interno ao cadastrar aluno.");
  }
});

exports.listaAlunosResponsavel = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "http://127.0.0.1:5500");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  if (req.method !== "GET") {
    return res.status(405).send("Método não permitido. Use GET.");
  }

  const idToken = req.headers.authorization;

  if (!idToken) {
    return res.status(403)
    .send("Acesso negado. Token de autenticação ausente.");
  }

  let uidResponsavel;

  try {
    const decodedToken = await admin.auth()
        .verifyIdToken(idToken.replace("Bearer ", ""));

    uidResponsavel = decodedToken.uid;
  } catch (error) {
    console.error("token erro", error);
    return res.status(403).send("token invalido");
  }

  try {
    const alunosSnapshot = await db.collection("alunos")
        .where("responsibleUID", "==", uidResponsavel)
        .get();

    const alunos = [];

    alunosSnapshot.forEach((doc) => {
      alunos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json(alunos);
  } catch (error) {
    console.error("Busca erro", error);
    return res.status(500).send("Erro interno ao buscar dados.");
  }
});
