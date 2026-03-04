provider "aws" {
  region     = "ap-northeast-2"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

resource "aws_route53_record" "sobok" {
  zone_id         = var.aws_route53_zone_id
  name            = var.domain
  type            = "A"
  ttl             = 300
  records         = [oci_core_public_ip.sobok.ip_address]
  allow_overwrite = true
}
