package com.kefang.backend.db.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "video")
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    private long accountId;
    private String countryCode;
    private String title;
    private String description;
    private String name;
    private String type;
    private Integer size;
    private String uploadId;
    private String assemblyId;
    private String uploadUrl;
    private String sslUrl;
    private String thumbnailUrl;
    private Date updatedAt;
    private Date createdAt;

    public Video() {
    }

    public Video(long id, long accountId, String countryCode, String title, String description, String name,
            String type, Integer size, String uploadId, String assemblyId, String uploadUrl,
            String sslUrl, String thumbnailUrl, Date updatedAt, Date createdAt) {
        this.id = id;
        this.accountId = accountId;
        this.countryCode = countryCode;
        this.title = title;
        this.description = description;
        this.name = name;
        this.type = type;
        this.size = size;
        this.uploadId = uploadId;
        this.assemblyId = assemblyId;
        this.uploadUrl = uploadUrl;
        this.sslUrl = sslUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.updatedAt = updatedAt;
        this.createdAt = createdAt;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public long getAccountId() {
        return accountId;
    }

    public void setAccountId(long accountId) {
        this.accountId = accountId;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public String getUploadId() {
        return uploadId;
    }

    public void setUploadId(String uploadId) {
        this.uploadId = uploadId;
    }

    public String getAssemblyId() {
        return assemblyId;
    }

    public void setAssemblyId(String assemblyId) {
        this.assemblyId = assemblyId;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public void setUploadUrl(String uploadUrl) {
        this.uploadUrl = uploadUrl;
    }

    public String getSslUrl() {
        return sslUrl;
    }

    public void setSslUrl(String sslUrl) {
        this.sslUrl = sslUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
