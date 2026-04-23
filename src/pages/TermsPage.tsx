import { useNavigate } from 'react-router-dom'

export default function TermsPage() {
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Voltar
        </button>
        <h1 style={styles.title}>Termos e Condições</h1>
        <div style={styles.placeholder} />
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <p style={styles.lastUpdate}>Última atualização: 15 de abril de 2026</p>

          <Section title="1. Aceitação dos Termos">
            <p>
              Bem-vindo ao <strong>QuandoChega</strong>. Ao aceder ou utilizar a nossa aplicação,
              você concorda em cumprir e ficar vinculado aos presentes Termos e Condições.
              Se não concordar com alguma parte destes termos, por favor, não utilize a aplicação.
            </p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>
              O <strong>QuandoChega</strong> é uma aplicação que fornece informações em tempo real
              sobre horários de autocarros, localização de paragens e planeamento de rotas
              no concelho de Bragança. O serviço inclui:
            </p>
            <ul style={styles.list}>
              <li>Consulta de horários de autocarros</li>
              <li>Localização de paragens no mapa</li>
              <li>Planeamento de viagens</li>
              <li>Notificações personalizadas</li>
              <li>Favoritos e histórico de pesquisas</li>
            </ul>
          </Section>

          <Section title="3. Registo e Conta de Utilizador">
            <p>
              Para aceder a determinadas funcionalidades, poderá ser necessário criar uma conta.
              Você é responsável por:
            </p>
            <ul style={styles.list}>
              <li>Manter a confidencialidade da sua palavra-passe</li>
              <li>Todas as atividades que ocorrem na sua conta</li>
              <li>Fornecer informações precisas e atualizadas</li>
              <li>Notificar imediatamente qualquer uso não autorizado da sua conta</li>
            </ul>
            <p>
              Reservamo-nos o direito de suspender ou cancelar contas que violem estes termos.
            </p>
          </Section>

          <Section title="4. Privacidade e Dados Pessoais">
            <p>
              A sua privacidade é importante para nós. A nossa <a href="/privacy" style={styles.link}>Política de Privacidade</a> explica como recolhemos, usamos e protegemos os seus dados pessoais. Ao utilizar a aplicação, você consente com a recolha e uso de informações de acordo com essa política.
            </p>
          </Section>

          <Section title="5. Precisão da Informação">
            <p>
              Embora nos esforcemos para manter a informação mais precisa e atualizada possível,
              os horários dos autocarros estão sujeitos a alterações sem aviso prévio.
              O <strong>QuandoChega</strong> não garante:
            </p>
            <ul style={styles.list}>
              <li>A precisão em tempo real dos horários</li>
              <li>A disponibilidade contínua do serviço</li>
              <li>A ausência de erros técnicos ou atrasos na atualização</li>
            </ul>
            <p>
              Recomendamos sempre confirmar os horários diretamente com a operadora de transportes.
            </p>
          </Section>

          <Section title="6. Utilização Aceitável">
            <p>
              Você concorda em utilizar a aplicação apenas para fins legais e de acordo com estes termos.
              É proibido:
            </p>
            <ul style={styles.list}>
              <li>Utilizar a aplicação para qualquer fim ilegal ou não autorizado</li>
              <li>Tentar aceder a áreas restritas do sistema</li>
              <li>Interferir com o funcionamento da aplicação</li>
              <li>Extrair dados em larga escala sem autorização (web scraping)</li>
              <li>Utilizar a aplicação para enviar spam ou conteúdo malicioso</li>
            </ul>
          </Section>

          <Section title="7. Propriedade Intelectual">
            <p>
              Todo o conteúdo da aplicação, incluindo logótipos, design, textos, gráficos e código,
              é propriedade do <strong>QuandoChega</strong> ou dos seus licenciadores e está protegido
              por leis de direitos de autor e propriedade intelectual. Não é permitido copiar,
              modificar, distribuir ou criar obras derivadas sem autorização expressa.
            </p>
          </Section>

          <Section title="8. Limitação de Responsabilidade">
            <p>
              Em nenhum caso o <strong>QuandoChega</strong> será responsável por quaisquer danos
              diretos, indiretos, incidentais, especiais ou consequentes resultantes do uso ou
              incapacidade de uso da aplicação, incluindo, sem limitação:
            </p>
            <ul style={styles.list}>
              <li>Atrasos ou cancelamentos de transportes</li>
              <li>Perda de tempo ou oportunidades</li>
              <li>Informações incorretas apresentadas pela aplicação</li>
              <li>Problemas técnicos ou indisponibilidade do serviço</li>
            </ul>
          </Section>

          <Section title="9. Modificações dos Termos">
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento.
              As alterações entram em vigor imediatamente após a sua publicação na aplicação.
              O uso continuado da aplicação após as alterações constitui a sua aceitação dos novos termos.
            </p>
          </Section>

          <Section title="10. Lei Aplicável">
            <p>
              Estes termos são regidos pelas leis da República Portuguesa.
              Qualquer litígio será submetido à jurisdição exclusiva dos tribunais da comarca de Bragança.
            </p>
          </Section>

          <Section title="11. Contacto">
            <p>
              Se tiver alguma dúvida sobre estes Termos e Condições, por favor contacte-nos:
            </p>
            <div style={styles.contactInfo}>
              <p>📧 Email: <a href="mailto:suporte@quandochega.pt" style={styles.link}>suporte@quandochega.pt</a></p>
              <p>📍 Morada: Bragança, Portugal</p>
            </div>
          </Section>

          <div style={styles.acceptance}>
            <p>
              Ao utilizar o <strong>QuandoChega</strong>, você declara que leu, compreendeu e aceita
              estes Termos e Condições na íntegra.
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