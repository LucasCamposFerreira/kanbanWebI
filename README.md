# kanbanWebI

Aplicação Web Kanban desenvolvida com **JavaScript**, **HTML** e **CSS**, usando **Firebase** (Authentication + Firestore) como back-end.

## Funcionalidades

- 🔐 Autenticação com e-mail/senha (Firebase Auth)
- 📋 Quadro Kanban por usuário criado automaticamente no primeiro acesso
- ➕ Criar, renomear e excluir colunas
- 🃏 Criar, editar e excluir cards (título + descrição opcional)
- 🖱️ Mover cards entre colunas via *drag-and-drop*
- ⚡ Atualizações em tempo real via Firestore

## Estrutura do Projeto

```
kanbanWebI/
├── index.html              # Página única (auth + board)
├── css/
│   └── style.css           # Estilos da aplicação
├── js/
│   ├── firebase-config.js  # Configuração do Firebase (editar aqui)
│   └── app.js              # Lógica da aplicação
└── README.md
```

## Como configurar

### 1. Criar um projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/) e crie um projeto.
2. Em **Authentication → Sign-in method**, habilite **E-mail/senha**.
3. Em **Firestore Database**, crie um banco em modo de produção (configure as regras abaixo).

### 2. Adicionar o app web ao projeto Firebase

1. No console do Firebase, clique em **Configurações do projeto → Seus apps → Adicionar app (Web)**.
2. Copie o objeto `firebaseConfig` gerado.

### 3. Configurar `js/firebase-config.js`

Substitua os valores de placeholder pelo seu próprio `firebaseConfig`:

```js
const firebaseConfig = {
  apiKey:            "SUA_API_KEY",
  authDomain:        "SEU_PROJECT_ID.firebaseapp.com",
  projectId:         "SEU_PROJECT_ID",
  storageBucket:     "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId:             "SEU_APP_ID"
};
```

### 4. Regras de segurança do Firestore

No console do Firebase, em **Firestore → Regras**, cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cada usuário acessa apenas o seu próprio quadro
    match /boards/{boardId} {
      allow read, write: if request.auth != null && request.auth.uid == boardId;

      match /columns/{columnId} {
        allow read, write: if request.auth != null && request.auth.uid == boardId;

        match /cards/{cardId} {
          allow read, write: if request.auth != null && request.auth.uid == boardId;
        }
      }
    }
  }
}
```

### 5. Executar

Abra `index.html` em um servidor HTTP local (ex: Live Server do VS Code) ou hospede os arquivos em qualquer serviço de hospedagem estática (Firebase Hosting, Netlify, Vercel, GitHub Pages).

> **Nota:** O Firebase SDK não funciona corretamente com o protocolo `file://` diretamente no navegador.

## Modelo de dados (Firestore)

```
boards/{userId}
  └── columns/{columnId}
        ├── name: string
        ├── order: number
        └── cards/{cardId}
              ├── title: string
              ├── description: string
              └── order: number
```