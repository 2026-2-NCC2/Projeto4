export function carregarResumoDashboard() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const simularErro = false

      if (simularErro) {
        reject(
          new Error(
            'Não foi possível carregar as informações.'
          )
        )

        return
      }

      resolve({
        atualizadoEm: new Date().toLocaleTimeString('pt-BR')
      })
    }, 800)
  })
}