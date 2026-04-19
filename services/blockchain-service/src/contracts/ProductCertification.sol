// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProductCertification {
    struct ExportCert {
        string seasonId;
        string certData;
        uint256 certifiedAt;
        bool isValid;
    }

    mapping(string => ExportCert) public certifications;

    event Certified(string indexed seasonId, string certData);

    function certifyExport(string memory _seasonId, string memory _certData) external {
        certifications[_seasonId] = ExportCert({
            seasonId: _seasonId,
            certData: _certData,
            certifiedAt: block.timestamp,
            isValid: true
        });
        emit Certified(_seasonId, _certData);
    }

    function verifyCertification(string memory _seasonId) external view returns (bool, string memory) {
        ExportCert memory cert = certifications[_seasonId];
        return (cert.isValid, cert.certData);
    }
}