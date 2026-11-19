import { Janela } from "./Janela";

/** Política de Privacidade resumida (LGPD). Loja fictícia: o responsável é o desenvolvedor do projeto. */
export function Politica({ aoFechar }: { aoFechar: () => void }) {
  return (
    <Janela titulo="Política de Privacidade" aoFechar={aoFechar}>
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          O Patas do Pico é um <strong>pet shop fictício</strong>, criado como demonstração. O responsável pelos dados é <strong>Rafael Moniz Izidio</strong>,
          desenvolvedor do projeto. Use dados de teste.
        </p>
        <p>
          <strong>O que guardamos:</strong> nome, e-mail, telefone, os pets que você cadastrar e seus agendamentos. Não pedimos CPF, data de nascimento nem dados de
          pagamento.
        </p>
        <p>
          <strong>Para que:</strong> identificar você, mostrar seus pets e agendamentos e permitir que a equipe confirme os horários.
        </p>
        <p>
          <strong>Por quanto tempo:</strong> nesta demonstração, todos os dados são apagados automaticamente quando o servidor reinicia. Você também pode excluir a
          conta a qualquer momento em <em>Meus dados</em>.
        </p>
        <p>
          <strong>Seus direitos (LGPD, art. 18):</strong> baixar uma cópia dos seus dados, corrigir e excluir a conta, tudo em <em>Meus dados</em>.
        </p>
      </div>
    </Janela>
  );
}
