import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app import create_app
from extensions import db
from models.complexity import ComplexityLevel
from models.nucleus import Nucleus
from models.pricing_rule import PricingRule
from models.service import Service
from models.user import User

NUCLEI_AND_SERVICES = {
    "Tecnologia": [
        "Implementação de Inteligência Artificial",
        "Ciência de Dados",
        "Desenvolvimento de Sistemas",
        "Desenvolvimento de Websites",
        "Desenvolvimento de Aplicativos",
    ],
    "Gestão Empresarial": [
        "Análise Financeira",
        "Plano de Negócio",
        "Plano de Marketing",
        "Pesquisa de Mercado",
    ],
    "Design": ["Identidade Visual", "Design de Produtos"],
    "Gestão de Processos": [
        "Cronoanálise",
        "Desenvolvimento de POPs",
        "Mapeamento de Processos",
        "Otimização de Processos",
        "Padronização de Processos",
    ],
    "Química e Alimentos": [
        "Pesquisa de Rota Produtiva",
        "Estudo e Desenvolvimento de Cosméticos",
        "Formulação de Alimentos",
        "Neutralização de Carbono",
        "Rotulagem de Produtos",
        "Estudo de Embalagem",
        "Análise de Componentes",
        "Manual BPF",
    ],
}

COMPLEXITIES = [
    ("Muito baixa", 0.85),
    ("Baixa", 0.95),
    ("Média", 1.00),
    ("Alta", 1.15),
    ("Muito alta", 1.35),
]

PRICING_RULES = [
    ("Imposto padrão", "default_tax_percentage", 13.5, "Percentual padrão inicial para impostos."),
    ("Margem mínima recomendada", "recommended_min_margin", 20, "Margem mínima para proteger custos e risco."),
    ("Margem ideal recomendada", "recommended_ideal_margin", 28, "Margem usada como referência interna."),
    ("Multiplicador faixa mínima", "minimum_price_multiplier", 0.9, "Multiplicador para gerar preço mínimo."),
    ("Multiplicador faixa premium", "premium_price_multiplier", 1.1, "Multiplicador para gerar preço premium."),
]


def seed_database() -> None:
    seed_nuclei_and_services()
    seed_complexities()
    seed_pricing_rules()
    seed_test_user()
    db.session.commit()


def seed_nuclei_and_services() -> None:
    for nucleus_name, service_names in NUCLEI_AND_SERVICES.items():
        nucleus = find_or_create_nucleus(nucleus_name)

        for service_name in service_names:
            find_or_create_service(nucleus, service_name)


def find_or_create_nucleus(name: str) -> Nucleus:
    nucleus = Nucleus.query.filter_by(name=name).first()

    if nucleus:
        return nucleus

    nucleus = Nucleus(name=name)
    db.session.add(nucleus)
    db.session.flush()
    return nucleus


def find_or_create_service(nucleus: Nucleus, name: str) -> Service:
    service = Service.query.filter_by(nucleus_id=nucleus.id, name=name).first()

    if service:
        return service

    service = Service(nucleus_id=nucleus.id, name=name)
    db.session.add(service)
    return service


def seed_complexities() -> None:
    for name, multiplier in COMPLEXITIES:
        complexity = ComplexityLevel.query.filter_by(name=name).first()

        if complexity:
            complexity.multiplier = multiplier
            continue

        db.session.add(ComplexityLevel(name=name, multiplier=multiplier))


def seed_pricing_rules() -> None:
    for rule_name, rule_key, rule_value, description in PRICING_RULES:
        rule = PricingRule.query.filter_by(rule_key=rule_key).first()

        if rule:
            rule.rule_value = rule_value
            rule.description = description
            continue

        db.session.add(
            PricingRule(
                rule_name=rule_name,
                rule_key=rule_key,
                rule_value=rule_value,
                description=description,
            )
        )


def seed_test_user() -> None:
    email = "teste@mauajr.com"
    user = User.query.filter_by(email=email).first()

    if user:
        return

    user = User(name="Usuário Teste", email=email)
    user.set_password("123456")
    db.session.add(user)


if __name__ == "__main__":
    app = create_app()

    with app.app_context():
        seed_database()
        print("Seed completed.")
