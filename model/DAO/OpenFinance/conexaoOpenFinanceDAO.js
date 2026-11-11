// Import da biblioteca knex, utilizada para facilitar a comunicação com o banco de dados MySQL
const knex = require('knex')

// Import do arquivo de configuração que contém as credenciais e parâmetros de conexão com o banco
const knexConfig = require('../../Database_config_knex/KnexFile.js')

// Cria a conexão com o banco de dados utilizando as configurações do ambiente "development"
const knexConex = knex(knexConfig.development)

// Criar conexão Open Finance
const criarConexao = async (conexao) => {
    try {
        // 1. Busca o ID numérico do usuário na tbl_usuario usando o ID ou o CPF recebido
        const userSql = `SELECT id FROM tbl_usuario WHERE id = ? OR cpf = ? LIMIT 1`
        const userResult = await knexConex.raw(userSql, [conexao.id_usuario, conexao.id_usuario])
        const usuarioEncontrado = userResult?.[0]?.[0]

        // Se encontrou o usuário pelo CPF, usa o id numérico (ex: 1), senão usa o valor recebido
        const idUsuarioFinal = usuarioEncontrado ? usuarioEncontrado.id : conexao.id_usuario

        // 2. Insere na tabela tbl_conexao_open_finance com o id_usuario correto
        const sql = `INSERT INTO tbl_conexao_open_finance
            (status, consentimento_api, ultima_sincronizacao, provedor, external_connection_id, id_usuario)
            VALUES (?, ?, ?, ?, ?, ?)`

        const result = await knexConex.raw(sql, [
            conexao.status ? 1 : 0,
            conexao.consentimento_api ?? null,
            conexao.ultima_sincronizacao ?? null,
            conexao.provedor ?? 'pluggy',
            conexao.external_connection_id ?? null,
            idUsuarioFinal
        ])

        return result?.[0]?.insertId || true
    } catch (error) {
        console.error('Erro ao criar conexão Open Finance:', error)
        return false
    }
}

// Listar conexões de um usuário (aceita tanto ID numérico quanto CPF)
const listarConexoesPorUsuario = async (idUsuario) => {
    try {
        const sql = `SELECT 
            c.id,
            c.status,
            c.consentimento_api,
            c.ultima_sincronizacao,
            c.provedor,
            c.external_connection_id,
            c.id_usuario
        FROM tbl_conexao_open_finance c
        LEFT JOIN tbl_usuario u ON u.id = c.id_usuario
        WHERE c.id_usuario = ? OR u.cpf = ?`

        const [result] = await knexConex.raw(sql, [idUsuario, idUsuario])
        return result || []
    } catch (error) {
        console.error('Erro ao listar conexões Open Finance:', error)
        return []
    }
}

// Buscar conexão por ID
const buscarConexaoPorId = async (id) => {
    const sql = `SELECT 
        id,
        status,
        consentimento_api,
        ultima_sincronizacao,
        provedor,
        external_connection_id,
        id_usuario
    FROM tbl_conexao_open_finance
    WHERE id = ?`

    try {
        const [result] = await knexConex.raw(sql, [id])
        return result?.[0] || false
    } catch (error) {
        console.error('Erro ao buscar conexão Open Finance:', error)
        return false
    }
}

module.exports = {
    criarConexao,
    listarConexoesPorUsuario,
    buscarConexaoPorId
}