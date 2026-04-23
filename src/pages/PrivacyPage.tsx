import { useNavigate } from 'react-router-dom'

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Voltar
        </button>
        <h1 style={styles.title}>Política de Privacidade</h1>
        <div style={styles.placeholder} />
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <p style={styles.lastUpdate}>Última atualização: 15 de abril de 2026</p>

          <Section title="1. Introdução">
            <p>
              A sua privacidade é importante para nós. Esta Política de Privacidade explica como
              o <strong>QuandoChega</strong> recolhe, usa, partilha e protege as suas informações
              pessoais quando utiliza a nossa aplicação.
            </p>
          </Section>

          <Section title="2. Informações que Recolhemos">
            <p><strong>2.1 Informações fornecidas por si:</strong></p>
            <ul style={styles.list}>
              <li>Nome completo</li>
              <li>Endereço de email</li>
              <li>Nacionalidade</li>
              <li>Palavra-passe (armazenada de forma segura e encriptada)</li>
            </ul>

            <p style={{ marginTop: 12 }}><strong>2.2 Informações recolhidas automaticamente:</strong></p>
            <ul style={styles.list}>
              <li>Localização geográfica (quando autorizada)</li>
              <li>Paragens e rotas pesquisadas</li>
              <li>Favoritos e histórico de utilizações</li>
              <li>Dados de utilização da aplicação</li>
              <li>Dispositivo, sistema operativo e versão da app</li>
            </ul>

            <p style={{ marginTop: 12 }}><strong>2.3 Informações de terceiros:</strong></p>
            <ul style={styles.list}>
              <li>Quando inicia sessão com Google, recolhemos o seu nome e email</li>
            </ul>
          </Section>

          <Section title="3. Como Utilizamos as suas Informações">
            <p>Utilizamos as suas informações para:</p>
            <ul style={styles.list}>
              <li>Criar e gerir a sua conta de utilizador</li>
              <li>Fornecer informações personalizadas sobre horários e rotas</li>
              <li>Melhorar a precisão dos horários com base na sua localização</li>
              <li>Enviar notificações sobre autocarros próximos (quando autorizado)</li>
              <li>Analisar e melhorar o desempenho da aplicação</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </Section>

          <Section title="4. Base Legal para o Tratamento de Dados">
            <p>
              O tratamento dos seus dados pessoais baseia-se em:
            </p>
            <ul style={styles.list}>
              <li><strong>Consentimento:</strong> quando aceita a nossa Política de Privacidade</li>
              <li><strong>Execução de contrato:</strong> para fornecer os serviços solicitados</li>
              <li><strong>Interesse legítimo:</strong> para melhorar a nossa aplicação</li>
              <li><strong>Obrigação legal:</strong> quando exigido por lei</li>
            </ul>
          </Section>

          <Section title="5. Partilha de Informações">
            <p>
              Não vendemos nem alugamos os seus dados pessoais a terceiros.
              Podemos partilhar informações nas seguintes circunstâncias:
            </p>
            <ul style={styles.list}>
              <li><strong>Fornecedores de serviços:</strong> empresas que nos ajudam a operar a aplicação (ex: Firebase, Google Cloud)</li>
              <li><strong>Obrigações legais:</strong> quando exigido por lei ou processo judicial</li>
              <li><strong>Proteção de direitos:</strong> para proteger os direitos, propriedade ou segurança do QuandoChega</li>
            </ul>
          </Section>

          <Section title="6. Localização Geográfica">
            <p>
              Solicitamos acesso à sua localização para:
            </p>
            <ul style={styles.list}>
              <li>Mostrar paragens próximas da sua posição atual</li>
              <li>Calcular o tempo de caminhada até às paragens</li>
              <li>Fornecer horários relevantes para a sua área</li>
            </ul>
            <p>
              Pode ativar ou desativar o acesso à localização nas definições do seu dispositivo.
              A localização nunca é partilhada com terceiros sem o seu consentimento explícito.
            </p>
          </Section>

          <Section title="7. Notificações Push">
            <p>
              Com a sua autorização, podemos enviar notificações push para:
            </p>
            <ul style={styles.list}>
              <li>Alertar sobre horários de autocarros próximos</li>
              <li>Informar sobre alterações de serviço</li>
              <li>Enviar lembretes personalizados</li>
            </ul>
            <p>
              Pode desativar as notificações nas definições do seu dispositivo ou da aplicação.
            </p>
          </Section>

          <Section title="8. Armazenamento e Segurança dos Dados">
            <p>
              Os seus dados são armazenados em servidores seguros da Firebase/Google Cloud,
              localizados na União Europeia. Implementamos medidas de segurança técnicas e
              organizacionais para proteger os seus dados contra acesso não autorizado,
              perda ou destruição, incluindo:
            </p>
            <ul style={styles.list}>
              <li>Encriptação de dados em trânsito (TLS/SSL)</li>
              <li>Encriptação de dados em repouso</li>
              <li>Controlos de acesso rigorosos</li>
              <li>Monitorização contínua de segurança</li>
            </ul>
          </Section>

          <Section title="9. Retenção de Dados">
            <p>
              Mantemos os seus dados pessoais apenas enquanto a sua conta estiver ativa
              ou conforme necessário para fornecer os serviços. Quando solicitar a eliminação
              da sua conta, os seus dados serão removidos no prazo de 30 dias,
              exceto quando exigido por lei para reter determinadas informações.
            </p>
          </Section>

          <Section title="10. Os seus Direitos (RGPD)">
            <p>
              Ao abrigo do Regulamento Geral de Proteção de Dados (RGPD), você tem os seguintes direitos:
            </p>
            <ul style={styles.list}>
              <li><strong>Direito de acesso:</strong> saber quais dados temos sobre si</li>
              <li><strong>Direito de retificação:</strong> corrigir dados inexatos</li>
              <li><strong>Direito ao apagamento:</strong> solicitar a eliminação dos seus dados</li>
              <li><strong>Direito à limitação:</strong> restringir o tratamento dos seus dados</li>
              <li><strong>Direito de oposição:</strong> opor-se ao tratamento dos seus dados</li>
              <li><strong>Direito à portabilidade:</strong> receber os seus dados num formato estruturado</li>
              <li><strong>Direito de retirar consentimento:</strong> a qualquer momento</li>
            </ul>
            <p>
              Para exercer estes direitos, contacte-nos através do email abaixo.
            </p>
          </Section>

          <Section title="11. Cookies e Tecnologias Semelhantes">
            <p>
              Utilizamos cookies e tecnologias semelhantes para:
            </p>
            <ul style={styles.list}>
              <li>Manter a sua sessão iniciada</li>
              <li>Armazenar as suas preferências</li>
              <li>Analisar o uso da aplicação</li>
            </ul>
            <p>
              Pode controlar os cookies através das definições do seu navegador ou dispositivo.
            </p>
          </Section>

          <Section title="12. Dados de Utilizadores Menores">
            <p>
              O <strong>QuandoChega</strong> não se destina a menores de 13 anos.
              Não recolhemos conscientemente dados pessoais de crianças. Se acredita que um
              menor nos forneceu dados pessoais, por favor contacte-nos para os removermos.
            </p>
          </Section>

          <Section title="13. Alterações a esta Política">
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente.
              Notificaremos sobre alterações significativas através da aplicação ou por email.
              A data da última atualização está indicada no topo desta página.
            </p>
          </Section>

          <Section title="14. Transferências Internacionais de Dados">
            <p>
              Os seus dados podem ser transferidos e armazenados em servidores localizados
              fora do seu país. Garantimos que todas as transferências cumprem as leis aplicáveis
              e que os seus dados recebem um nível adequado de proteção.
            </p>
          </Section>

          <Section title="15. Contacto do Encarregado de Proteção de Dados">
            <p>
              Se tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados,
              por favor contacte o nosso Encarregado de Proteção de Dados (DPO):
            </p>
            <div style={styles.contactInfo}>
              <p>📧 Email: <a href="mailto:privacidade@quandochega.pt" style={styles.link}>privacidade@quandochega.pt</a></p>
              <p>📍 Morada: Bragança, Portugal</p>
            </div>
          </Section>

          <Section title="16. Autoridade de Controlo">
            <p>
              Caso não esteja satisfeito com a nossa resposta, tem o direito de apresentar
              uma reclamação à Comissão Nacional de Proteção de Dados (CNPD):
            </p>
            <div style={styles.contactInfo}>
              <p>🌐 <a href="https://www.cnpd.pt" style={styles.link} target="_blank" rel="noopener noreferrer">www.cnpd.pt</a></p>
              <p>📍 Rua de São Bento, 148, 1200-821 Lisboa</p>
            </div>
          </Section>

          <div style={styles.acceptance}>
            <p>
              Ao utilizar o <strong>QuandoChega</strong>, você declara que leu, compreendeu e aceita
              esta Política de Privacidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div style={styles.sectionContent}>{children}</div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#0D0D0D',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: '#1a1a1a',
    borderBottom: '1px solid #333',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#5CB130',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: 8,
    transition: 'background 0.2s',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  placeholder: {
    width: 80,
  },
  content: {
    flex: 1,
    padding: '20px',
    maxWidth: 800,
    margin: '0 auto',
    width: '100%',
  },
  card: {
    background: '#1a1a1a',
    borderRadius: 16,
    padding: '24px',
    marginBottom: 20,
  },
  lastUpdate: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid #333',
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid #2a2a2a',
  },
  sectionTitle: {
    color: '#5CB130',
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
  },
  sectionContent: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 1.6,
  },
  list: {
    margin: '8px 0',
    paddingLeft: 20,
    color: '#aaa',
    fontSize: 14,
    lineHeight: 1.6,
  },
  link: {
    color: '#5CB130',
    textDecoration: 'none',
  },
  contactInfo: {
    marginTop: 12,
    padding: 12,
    background: '#0D0D0D',
    borderRadius: 8,
  },
  acceptance: {
    marginTop: 24,
    padding: 16,
    background: 'rgba(92, 177, 48, 0.1)',
    borderRadius: 12,
    textAlign: 'center',
    border: '1px solid rgba(92, 177, 48, 0.3)',
  },
}