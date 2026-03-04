# --- VCN ---
resource "oci_core_vcn" "sobok" {
  compartment_id = local.compartment_ocid
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "sobok-vcn"
  dns_label      = "sobokvcn"
}

# --- Internet Gateway ---
resource "oci_core_internet_gateway" "sobok" {
  compartment_id = local.compartment_ocid
  vcn_id         = oci_core_vcn.sobok.id
  display_name   = "sobok-igw"
  enabled        = true
}

# --- Route Table ---
resource "oci_core_route_table" "sobok" {
  compartment_id = local.compartment_ocid
  vcn_id         = oci_core_vcn.sobok.id
  display_name   = "sobok-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.sobok.id
  }
}

# --- Security List ---
resource "oci_core_security_list" "sobok" {
  compartment_id = local.compartment_ocid
  vcn_id         = oci_core_vcn.sobok.id
  display_name   = "sobok-sl"

  # Egress: allow all
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
    stateless   = false
  }

  # SSH
  ingress_security_rules {
    source    = "0.0.0.0/0"
    protocol  = "6" # TCP
    stateless = false

    tcp_options {
      min = 22
      max = 22
    }
  }

  # HTTP
  ingress_security_rules {
    source    = "0.0.0.0/0"
    protocol  = "6"
    stateless = false

    tcp_options {
      min = 80
      max = 80
    }
  }

  # HTTPS
  ingress_security_rules {
    source    = "0.0.0.0/0"
    protocol  = "6"
    stateless = false

    tcp_options {
      min = 443
      max = 443
    }
  }

  # ICMP (ping)
  ingress_security_rules {
    source    = "0.0.0.0/0"
    protocol  = "1" # ICMP
    stateless = false

    icmp_options {
      type = 3
      code = 4
    }
  }

  ingress_security_rules {
    source    = "10.0.0.0/16"
    protocol  = "1"
    stateless = false

    icmp_options {
      type = 3
    }
  }
}

# --- Public Subnet ---
resource "oci_core_subnet" "sobok_public" {
  compartment_id             = local.compartment_ocid
  vcn_id                     = oci_core_vcn.sobok.id
  cidr_block                 = "10.0.1.0/24"
  display_name               = "sobok-public-subnet"
  dns_label                  = "sobokpub"
  route_table_id             = oci_core_route_table.sobok.id
  security_list_ids          = [oci_core_security_list.sobok.id]
  prohibit_public_ip_on_vnic = false
}
