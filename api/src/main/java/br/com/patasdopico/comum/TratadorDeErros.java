package br.com.patasdopico.comum;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Transforma erros em respostas JSON padronizadas (RFC 9457 / ProblemDetail), em português. */
@RestControllerAdvice
public class TratadorDeErros {

    @ExceptionHandler(NaoAutorizadoException.class)
    ProblemDetail naoAutorizado(NaoAutorizadoException e) {
        return problema(HttpStatus.UNAUTHORIZED, "Não autorizado", e.getMessage());
    }

    @ExceptionHandler(NaoEncontradoException.class)
    ProblemDetail naoEncontrado(NaoEncontradoException e) {
        return problema(HttpStatus.NOT_FOUND, "Não encontrado", e.getMessage());
    }

    @ExceptionHandler(ConflitoException.class)
    ProblemDetail conflito(ConflitoException e) {
        return problema(HttpStatus.CONFLICT, "Operação não permitida", e.getMessage());
    }

    /** Campos inválidos: devolve um mapa campo → mensagem. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalido(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> campos.putIfAbsent(f.getField(), f.getDefaultMessage()));
        ProblemDetail p = problema(HttpStatus.BAD_REQUEST, "Dados inválidos", "Confira os campos destacados.");
        p.setProperty("campos", campos);
        return p;
    }

    @ExceptionHandler(CampoInvalidoException.class)
    ProblemDetail campoInvalido(CampoInvalidoException e) {
        ProblemDetail p = problema(HttpStatus.BAD_REQUEST, "Dados inválidos", "Confira os campos destacados.");
        p.setProperty("campos", Map.of(e.getCampo(), e.getMessage()));
        return p;
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ProblemDetail ilegivel(Exception e) {
        return problema(HttpStatus.BAD_REQUEST, "Dados inválidos", "O formato enviado não é válido.");
    }

    private static ProblemDetail problema(HttpStatus status, String titulo, String detalhe) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, detalhe);
        p.setTitle(titulo);
        return p;
    }
}
