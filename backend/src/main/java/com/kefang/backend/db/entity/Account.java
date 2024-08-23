package com.kefang.backend.db.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

@Entity
@Table(name = "account")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "account_id_seq")
    @SequenceGenerator(name = "account_id_seq", sequenceName = "account_id_seq", allocationSize = 1)
    private long id;
    private String identityType;
    private String identityValue;
    private String state;
    private Date createdAt;
    private Date deletedAt;

    public Account() {
    }

    public Account(String identityType, String identityValue, String state, Date createdAt, Date deletedAt) {
        this.identityType = identityType;
        this.identityValue = identityValue;
        this.state = state;
        this.createdAt = createdAt;
        this.deletedAt = deletedAt;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getIdentityType() {
        return identityType;
    }

    public void setIdentityType(String identityType) {
        this.identityType = identityType;
    }

    public String getIdentityValue() {
        return identityValue;
    }

    public void setIdentityValue(String identityValue) {
        this.identityValue = identityValue;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Date deletedAt) {
        this.deletedAt = deletedAt;
    }

}
