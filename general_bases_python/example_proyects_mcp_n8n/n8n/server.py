from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.server import Settings
from mcp.server.fastmcp.utilities import logging
import requests

mcp = FastMCP("testMCP")

mcp.settings = Settings(port=int(3001))

logger = logging.get_logger(__name__)


@mcp.tool()
def saludame(nombre: str)->str: 
    """Saludo al usuario usando el nombre 
    
    Args:
        nombre: required
    """
    logger.info(f"el usuario envió {nombre}")
    return f"Hola {nombre}"


@mcp.tool()
def enviar_articulo(code: str, store: str)->str:
    """Envia articulo a las tiendas de EPA en Costa Rica

    Args:
        code: required
        store: required
    """

    logger.info(f"Datos de usuario codigos {code} y tiendas {store}")

    article_dict_api = {
        "articles": code.split(","),
        "stores": store.split(",")
        }
    
    logger.info(article_dict_api)


    #try:
    #    response =requests.post("http://internal-preprodate-cr-bopos-lb-834087683.us-east-1.elb.amazonaws.com/api/v1/article/send", json=article_dict_api)
    #    response.raise_for_status()
    #except requests.exceptions.RequestException as e:
    #    raise Exception(f"Error al enviar el artículo: {e}")
#
    #logger.info(f"{response}")
    #return response.json()['message']
    return "Articulo enviado"
     

if __name__ == "__main__":
    mcp.run(transport="sse")
    
