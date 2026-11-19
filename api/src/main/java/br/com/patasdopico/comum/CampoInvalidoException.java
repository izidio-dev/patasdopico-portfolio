package br.com.patasdopico.comum;

/** Erro de validação de um campo específico, detectado nas regras de negócio (vira 400). */
public class CampoInvalidoException extends RuntimeException {
    private final String campo;

    public CampoInvalidoException(String campo, String mensagem) {
        super(mensagem);
        this.campo = campo;
    }

    public String getCampo() { return campo; }
}
