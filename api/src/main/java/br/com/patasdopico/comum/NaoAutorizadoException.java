package br.com.patasdopico.comum;

/** Login recusado (vira 401). */
public class NaoAutorizadoException extends RuntimeException {
    public NaoAutorizadoException(String mensagem) {
        super(mensagem);
    }
}
