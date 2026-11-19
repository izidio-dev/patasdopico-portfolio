package br.com.patasdopico.comum;

/** Operação que não faz sentido no estado atual (vira 409). */
public class ConflitoException extends RuntimeException {
    public ConflitoException(String mensagem) {
        super(mensagem);
    }
}
