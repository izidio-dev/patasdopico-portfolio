package br.com.patasdopico.servico;

import br.com.patasdopico.atendimento.Atendimento.Servico;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServicoPrecoRepository extends JpaRepository<ServicoPreco, Servico> {}
