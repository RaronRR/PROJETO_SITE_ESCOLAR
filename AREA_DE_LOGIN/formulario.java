package AREA_DE_LOGIN;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class formulario{
    public static void main(String[] args) {
    
        String dbHost = "localhost";
        String dbUsername= "root";
        String dbPassword = "985421554Rr";
        String dbName = "formulario_projeto ";

        String dbUrl = "jdbc:mysql://" + dbHost + ":" + 3306 + "/" + dbName;
        Connection conexao = null;

        try {
            conexao = DriverManager.getConnection(dbUrl, dbUsername, dbPassword);

            System.out.println("Conexão com o banco de dados estabelecido");
        
        } catch (SQLException e) {
            System.err.println("Erro ao conectar banco de dados");
            System.err.println("Detalhes do Erro: " + e.getMessage());
        
        }finally{
            if ( conexao != null){
                try{
                    conexao.close();
                    System.out.println("Conexão fechada");
                
                }catch (SQLException e){
                    System.err.println("Erro ao fechar a conexão" + e.getMessage());
                }
            }
        }
    }

    
}
