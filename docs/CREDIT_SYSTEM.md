# Sistema de Créditos

Este documento descreve como o sistema de créditos funciona e como implementá-lo em diferentes partes do aplicativo.

## Visão Geral

O sistema de créditos permite que os usuários realizem ações específicas na plataforma, como gerar músicas, separar vocais, etc. Cada ação consome uma quantidade específica de créditos.

## Estrutura do Banco de Dados

### Tabelas

1. **credit_transactions**
   - Registra todas as transações de crédito (adicionais, uso, reembolsos, bônus)
   - Campos: id, user_id, amount, type, description, reference_id, created_at, expires_at, status

2. **user_credits**
   - Armazena o saldo atual de créditos do usuário
   - Campos: user_id, available_credits, used_credits, total_credits, expires_at, created_at, updated_at

## Como Usar o Sistema de Créditos

### 1. Verificando Créditos Disponíveis

```typescript
import { useCredits } from '@/hooks/use-credits'

function MyComponent() {
  const { balance, isLoading } = useCredits()
  
  if (isLoading) return <div>Carregando...</div>
  
  return (
    <div>
      <p>Créditos disponíveis: {balance.available}</p>
      <p>Créditos utilizados: {balance.used}</p>
      <p>Total de créditos: {balance.total}</p>
    </div>
  )
}
```

### 2. Verificando se o Usuário tem Créditos Suficientes

```typescript
import { useHasEnoughCredits } from '@/hooks/use-credits'

function MusicGenerator() {
  const { hasEnough, isLoading } = useHasEnoughCredits('generate_music')
  
  if (isLoading) return <div>Verificando créditos...</div>
  
  if (!hasEnough) {
    return <div>Você não tem créditos suficientes para gerar uma música.</div>
  }
  
  // Renderizar o gerador de música
}
```

### 3. Gastando Créditos

```typescript
import { useCredits } from '@/hooks/use-credits'

function MusicGenerator() {
  const { deductCredits } = useCredits()
  
  const handleGenerateMusic = async () => {
    try {
      // Primeiro, deduz os créditos
      await deductCredits('generate_music')
      
      // Se chegou aqui, o usuário tinha créditos suficientes
      // Agora podemos prosseguir com a geração da música
      const result = await generateMusic()
      
      return result
    } catch (error) {
      console.error('Erro ao deduzir créditos:', error)
      // Mostrar mensagem de erro para o usuário
    }
  }
  
  return (
    <button onClick={handleGenerateMusic}>
      Gerar Música (20 créditos)
    </button>
  )
}
```

### 4. Adicionando Créditos

```typescript
import { useCredits } from '@/hooks/use-credits'

function AddCreditsButton() {
  const { addCredits } = useCredits()
  
  const handleAddCredits = async (amount: number) => {
    try {
      await addCredits(amount, 30) // 30 dias para expirar
      // Mostrar mensagem de sucesso
    } catch (error) {
      console.error('Erro ao adicionar créditos:', error)
      // Mostrar mensagem de erro
    }
  }
  
  return (
    <button onClick={() => handleAddCredits(100)}>
      Comprar 100 créditos
    </button>
  )
}
```

## Tipos de Transações

- `purchase`: Compra de créditos
- `usage`: Uso de créditos para uma ação
- `refund`: Reembolso de créditos
- `bonus`: Bônus concedido pelo sistema
- `signup_bonus`: Bônus por cadastro
- `referral`: Bônus por indicação
- `expiration`: Créditos expirados

## Funções do Banco de Dados

### `add_credits(user_id, credits_to_add, expires_in_days, transaction_type, description, reference_id)`

Adiciona créditos à conta de um usuário.

### `deduct_credits(user_id, credits_to_deduct, action_type, reference_id)`

Deduz créditos da conta de um usuário.

### `get_user_credit_balance(user_id)`

Retorna o saldo de créditos de um usuário.

### `expire_old_credits()`

Expira créditos antigos (deve ser executado diariamente).

## Boas Práticas

1. **Sempre verifique os créditos antes de executar uma ação**
   - Use `useHasEnoughCredits` para verificar rapidamente
   - Ou use `deductCredits` que já faz a verificação

2. **Trate erros adequadamente**
   - Capture e trate erros ao gastar créditos
   - Informe ao usuário quando ele não tiver créditos suficientes

3. **Atualize a interface**
   - Use o retorno das funções para atualizar a interface imediatamente
   - Ou use o listener em tempo real para atualizações

4. **Documente os custos**
   - Deixe claro para o usuário quantos créditos cada ação custa
   - Mostre o saldo atual de forma visível

## Testes

Certifique-se de testar:

1. Adição de créditos
2. Uso de créditos
3. Verificação de saldo insuficiente
4. Expiração de créditos
5. Atualização em tempo real do saldo

## Segurança

- Todas as operações de crédito são validadas no servidor
- As funções do banco de dados usam `security definer` para garantir permissões adequadas
- As transações são atômicas para evitar condições de corrida
