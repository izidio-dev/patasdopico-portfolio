package br.com.patasdopico.comum;

/** Registro inexistente (vira 404). */
public class NaoEncontradoException extends RuntimeException {
    public NaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
