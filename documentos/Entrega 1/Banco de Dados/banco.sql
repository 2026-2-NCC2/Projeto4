CREATE DATABASE TrocaTicket;
USE TrocaTicket;

CREATE TABLE Administrador (
    idAdministrador INT PRIMARY KEY AUTO_INCREMENT,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE Organizador (
    idOrganizador INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    whatsapp VARCHAR(20),
    cidade VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(100),
    estado VARCHAR(50),
    descricao VARCHAR(500)
);

CREATE TABLE Evento (
    idEvento INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizador INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(500),
    capacidade INT,
    endereco VARCHAR(200),
    estado VARCHAR(50),
    cidade VARCHAR(100),
    dataEvento DATE NOT NULL,
    status VARCHAR(30),
    FOREIGN KEY (idOrganizador) REFERENCES Organizador(idOrganizador)
);

CREATE TABLE Requerimento (
    idRequerimento INT PRIMARY KEY AUTO_INCREMENT,
    idEvento INT NOT NULL,
    quantidade INT NOT NULL,
    categoria VARCHAR(50),
    descricao VARCHAR(500),
    status VARCHAR(30),
    FOREIGN KEY (idEvento) REFERENCES Evento(idEvento)
);

CREATE TABLE Fornecedor (
    idFornecedor INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cnpjCpf VARCHAR(18),
    categoria VARCHAR(50),
    estado VARCHAR(50),
    cidade VARCHAR(100),
    descricao VARCHAR(500),
    cep VARCHAR(9)
);

CREATE TABLE Proposta (
    idProposta INT PRIMARY KEY AUTO_INCREMENT,
    idRequerimento INT NOT NULL,
    idFornecedor INT NOT NULL,
    quantidade INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao VARCHAR(500),
    status VARCHAR(30),
    dataEnvio DATE,
    FOREIGN KEY (idRequerimento) REFERENCES Requerimento(idRequerimento),
    FOREIGN KEY (idFornecedor) REFERENCES Fornecedor(idFornecedor)
);
